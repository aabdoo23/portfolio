import { useState } from 'react';
import {
    FaGraduationCap, FaBriefcase, FaChevronLeft, FaBookOpen,
    FaCertificate, FaCode, FaUsers, FaPalette, FaTrophy
} from 'react-icons/fa';
import { userConfig } from '../../config/userConfig';

interface NotesAppProps {
    isOpen: boolean;
    onClose: () => void;
}

type Section =
    | 'menu'
    | 'education'
    | 'experience'
    | 'courses'
    | 'certifications'
    | 'skills'
    | 'roles'
    | 'activities'
    | 'competitions';

// Type for storing image indices per item
type ImageIndicesState = Record<string, number>;

const NotesApp = ({ isOpen, onClose }: NotesAppProps) => {
    const [activeSection, setActiveSection] = useState<Section>('menu');
    // Store image indices in an object: { 'itemId': index }
    const [activeImageIndices, setActiveImageIndices] = useState<ImageIndicesState>({});

    const handleSectionClick = (section: Section) => {
        setActiveSection(section);
        // No need to reset image indices globally here, 
        // they are per-item now and will default to 0 if not set
    };

    const handleBackClick = () => {
        setActiveSection('menu');
    };

    // Update image index for a specific item
    const handleNextImage = (itemId: string, images: any[]) => {
        setActiveImageIndices(prevIndices => ({
            ...prevIndices,
            [itemId]: ((prevIndices[itemId] ?? -1) + 1) % images.length
        }));
    };

    // Update image index for a specific item
    const handlePrevImage = (itemId: string, images: any[]) => {
        setActiveImageIndices(prevIndices => ({
            ...prevIndices,
            [itemId]: ((prevIndices[itemId] ?? 0) - 1 + images.length) % images.length
        }));
    };

    if (!isOpen) return null;

    const education = userConfig.education || [];
    const experience = userConfig.experience || [];
    const courses = userConfig.courses || [];
    const certifications = userConfig.certifications || [];
    const skills = userConfig.skills || [];
    const roles = userConfig.extraCurricularRoles || [];
    const activities = userConfig.extraCurricularActivities || [];
    const competitions = userConfig.competitions || [];

    const renderBackButton = () => (
        <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-300 hover:text-gray-100 mb-4"
        >
            <FaChevronLeft />
            <span>Back to Menu</span>
        </button>
    );

    // Accepts itemId to manage state correctly
    const renderImageCarousel = (itemId: string, images: any[]) => {
        const currentIndex = activeImageIndices[itemId] ?? 0;
        // Ensure currentIndex is valid if item has no images initially or state is somehow wrong
        if (!images || images.length === 0 || currentIndex >= images.length) {
            return null; // Or render a placeholder/error
        }
        
        return (
            <div className="mt-4">
                <div className="rounded-lg overflow-hidden mb-2">
                    <img
                        src={images[currentIndex].url}
                        alt={images[currentIndex].alt}
                        className="w-full object-cover rounded-lg"
                    />
                </div>
                
                <div className="text-sm text-gray-400 mb-3">
                    {images[currentIndex].description}
                </div>
                
                {images.length > 1 && (
                    <div className="flex justify-between mt-2">
                        <button
                            onClick={() => handlePrevImage(itemId, images)}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                            ←
                        </button>
                        <span className="text-gray-400">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={() => handleNextImage(itemId, images)}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderEducation = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Education</h2>
            {education.map((item, index) => {
                const itemId = `education-${index}`; // Unique ID for the item
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.degree} {item.major && `- ${item.major}`}</h3>
                        <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                        <div className="text-gray-400 mb-3">{item.year}</div>
                        <p className="text-gray-300 mb-4">{item.description}</p>
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderExperience = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Professional Experience</h2>
            {experience.map((item, index) => {
                const itemId = `experience-${index}`; // Unique ID
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.title}</h3>
                        <div className="text-gray-300 mb-2">{item.company}, {item.location}</div>
                        <div className="text-gray-400 mb-3">{item.period}</div>
                        <p className="text-gray-300 mb-4">{item.description}</p>
                        {item.technologies && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {item.technologies.map((tech, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        )}
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderCourses = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Courses</h2>
            {courses.map((item, index) => {
                const itemId = `courses-${index}`; // Unique ID
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.title}</h3>
                        <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                        <div className="text-gray-400 mb-3">{item.year}</div>
                        <p className="text-gray-300 mb-4">{item.description}</p>
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderCertifications = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Certifications</h2>
            {certifications.map((item, index) => {
                const itemId = `certifications-${index}`; // Unique ID
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.title}</h3>
                        <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                        <div className="text-gray-400 mb-3">{item.year}</div>
                        <p className="text-gray-300 mb-4">{item.description}</p>
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderSkills = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Skills</h2>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300">
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    );

    const renderExtraCurricularRoles = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Extracurricular Roles</h2>
            {roles.map((item, index) => {
                const itemId = `roles-${index}`; // Unique ID
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.role}</h3>
                        <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                        <div className="text-gray-400 mb-3">{item.year}</div>
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderExtraCurricularActivities = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Extracurricular Activities</h2>
            {activities.map((item, index) => {
                const itemId = `activities-${index}`; // Unique ID
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.title}</h3>
                        <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                        <div className="text-gray-400 mb-3">{item.year}</div>
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderCompetitions = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Competitions</h2>
            {competitions.map((item, index) => {
                const itemId = `competitions-${index}`; // Unique ID
                return (
                    <div key={itemId} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <h3 className="text-xl font-semibold text-gray-200">{item.title}</h3>
                        <div className="text-gray-300 mb-2">{item.description}</div>
                        <div className="text-gray-400 mb-3">Achievement: {item.achievement} ({item.year})</div>
                        {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                    </div>
                );
            })}
        </div>
    );

    const renderMenu = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6">My Notes</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Education */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('education')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <FaGraduationCap size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Education</h3>
                    </div>
                    <p className="text-gray-400">View my educational background and qualifications</p>
                </div>

                {/* Experience */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('experience')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                            <FaBriefcase size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Professional Experience</h3>
                    </div>
                    <p className="text-gray-400">Explore my professional work experience</p>
                </div>
                {/* Extracurricular Roles */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('roles')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <FaUsers size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Extracurricular Roles</h3>
                    </div>
                    <p className="text-gray-400">My involvement in student activities and roles</p>
                </div>

                {/* Extracurricular Activities */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('activities')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
                            <FaPalette size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Extracurricular Activities</h3>
                    </div>
                    <p className="text-gray-400">My participation in events and activities</p>
                </div>
                {/* Courses */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('courses')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <FaBookOpen size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Courses</h3>
                    </div>
                    <p className="text-gray-400">Check out courses I have completed</p>
                </div>

                {/* Certifications */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('certifications')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                            <FaCertificate size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Certifications</h3>
                    </div>
                    <p className="text-gray-400">View my professional certifications</p>
                </div>

                {/* Skills */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('skills')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                            <FaCode size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Skills</h3>
                    </div>
                    <p className="text-gray-400">See my technical skills and expertise</p>
                </div>

                {/* Competitions */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('competitions')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                            <FaTrophy size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Competitions</h3>
                    </div>
                    <p className="text-gray-400">View my competition history and achievements</p>
                </div>
            </div>
        </div>
    );

    const getWindowTitle = () => {
        switch (activeSection) {
            case 'menu': return 'Notes';
            case 'education': return 'Education Notes';
            case 'experience': return 'Experience Notes';
            case 'courses': return 'Courses Notes';
            case 'certifications': return 'Certifications Notes';
            case 'skills': return 'Skills Notes';
            case 'roles': return 'Extracurricular Roles Notes';
            case 'activities': return 'Extracurricular Activities Notes';
            case 'competitions': return 'Competitions Notes';
            default: return 'Notes';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-[#1d1d1f] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <div className="bg-gray-800 h-6 flex items-center space-x-2 px-4 rounded-t-lg absolute top-0 left-0 right-0">
                    <button
                        onClick={onClose}
                        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                    />
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-300 flex-grow text-center font-semibold">
                        {getWindowTitle()}
                    </span>
                </div>

                <div className="mt-8">
                    {activeSection === 'menu' && renderMenu()}
                    {activeSection === 'education' && renderEducation()}
                    {activeSection === 'experience' && renderExperience()}
                    {activeSection === 'courses' && renderCourses()}
                    {activeSection === 'certifications' && renderCertifications()}
                    {activeSection === 'skills' && renderSkills()}
                    {activeSection === 'roles' && renderExtraCurricularRoles()}
                    {activeSection === 'activities' && renderExtraCurricularActivities()}
                    {activeSection === 'competitions' && renderCompetitions()}
                </div>
            </div>
        </div>
    );
};

export default NotesApp; 